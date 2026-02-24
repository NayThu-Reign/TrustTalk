import { ticketSchema } from '@/app/lib/schema_validation';
import { NextResponse } from 'next/server';
import p from '@/app/lib/prisma';
import { findAllRecords, userTokenValidation, getUserDataWithCache } from '@/app/lib/functions';
import { ZodError } from "zod";
import fs from "fs";
import fsPromises from 'fs/promises';
import path from 'path';
import formidable from 'formidable-serverless';
import { decrypt } from '@/app/lib/functions';
import { sendClientTicketEmail, sendTicketUpdateEmail } from '@/app/lib/send_mail';

// import { io } from '@/server';
const prisma = p;
export const dynamic = 'force-dynamic';

export const GET = async (request, context) => {
    const token = await userTokenValidation(request);
    if (!token) {
        return NextResponse.json({error: { message: 'Missing or invalid Authorization' }}, { status: 401 });
    }
    const allTickets = await findAllRecords('ticket');
    return NextResponse.json(allTickets);
}

async function saveTickets(body) {
    let newTicket;

    try {
        const result = await prisma.$transaction(async (tx) => {
            const savedata = {
                title: body.title,
                description: body.description,
                status: body.status || "Opening",
                priority: body.priority || "Medium",
                categoryId: Number(body.categoryId),
                assigneeId: body.assigneeId || null,
                startDate: body.startDate || null,
                endDate: body.endDate || null,
                issuerId: body.issuerId || null,
                departmentId: Number(body.departmentId),
                levelId: Number(body.levelId) || 1,
                typeId: Number(body.typeId) || 1,
                labelId: Number(body.labelId) || 1,
                flagId: Number(body.flagId) || 1,
                firstName: body.firstName || null,
                lastName: body.lastName || null,
                email: body.email || null,
                location: body.location || null,
                internalTicket: body.internalTicket || 0,
                repeatSchedule: body.repeatSchedule || null,
                scheduleDate: body.scheduleDate || null,
                scheduleEndDate: body.scheduleEndDate || null,
                visible: body.visible || 0,
            };

            const newTicket = await tx.ticket.create({
                data: savedata,
                include: {
                    customFieldValues: true,
                    customFieldGroupValues: true,
                },
            });

            const repeatDayData = [];
            if (body.repeatSchedule === "Daily" && Array.isArray(body.repeatDays)) {
                for (const day of body.repeatDays) {
                    repeatDayData.push({ day, ticketId: newTicket.id });
                }
            } else if (body.repeatSchedule === "Weekly" && body.repeatDay) {
                repeatDayData.push({ day: body.repeatDay, ticketId: newTicket.id });
            }
            if (repeatDayData.length > 0) {
                await tx.repeat_day.createMany({ data: repeatDayData });
            }

            const customFieldValues = Array.isArray(body.customFieldValues) ? body.customFieldValues : [];
            const ticketCustomFieldValues = [];

            for (const field of customFieldValues) {
                if (field.checkbox) {
                    const selected = field.checkbox.optionFields.filter(o => o.selected === 1).map(o => o.value);
                    ticketCustomFieldValues.push({
                        customFieldId: field.customFieldId,
                        fieldValue: selected.join(', '),
                        staff_editable: field.checkbox.staff_editable,
                        fieldTitle: field.checkbox.fieldTitle || "",
                        message: ""
                    });
                } else if (field.radioButton) {
                    const selected = field.radioButton.optionFields.find(o => o.selected === 1)?.value || "";
                    ticketCustomFieldValues.push({
                        customFieldId: field.customFieldId,
                        fieldValue: selected,
                        staff_editable: field.radioButton.staff_editable,
                        fieldTitle: field.radioButton.fieldTitle || "",
                        message: ""
                    });
                } else if (field.dateTime) {
                    ticketCustomFieldValues.push({
                        customFieldId: field.customFieldId,
                        fieldValue: field.dateTime.defaultValue,
                        staff_editable: field.dateTime.staff_editable,
                        fieldTitle: field.dateTime.fieldTitle || "",
                        subject: field.dateTime.fieldTitle || "",
                        message: field.dateTime.fieldDescription || ""
                    });
                } else {
                    ticketCustomFieldValues.push({
                        customFieldId: field.customFieldId,
                        fieldTitle: field.fieldTitle || "",
                        fieldValue: field.fieldValue || "",
                        staff_editable: field.staff_editable,
                        subject: field.subject || "",
                        message: field.message || ""
                    });
                }
            }

            if (ticketCustomFieldValues.length > 0) {
                await tx.ticketCustomFieldValue.createMany({
                    data: ticketCustomFieldValues.map(field => ({
                        ticketId: newTicket.id,
                        ...field
                    }))
                });
            }

            const groupValues = Array.isArray(body.customFieldGroupValues) ? body.customFieldGroupValues : [];
            if (groupValues.length > 0) {
                await tx.ticketCustomFieldGroupValue.createMany({
                    data: groupValues.map(field => ({
                        ticketId: newTicket.id,
                        customFieldGroupId: field.id,
                        subject: field.subject || '',
                        message: field.message || ''
                    }))
                });
            }

            const notificationMessage = `New Ticket: TL - ${newTicket.title}`;
            await tx.notification.create({
                data: {
                    message: notificationMessage,
                    ticketId: newTicket.id,
                    type: "Ticket Creation",
                    departmentId: newTicket.departmentId,
                }
            });

            return { newTicket };
        });

        newTicket = result.newTicket;

        // Run slow tasks in background
        setImmediate(async () => {
            try {
                const attachment = Array.isArray(body.ticket_attachment) ? body.ticket_attachment : [];
                const currentDate = new Date();
                const year = currentDate.getFullYear();
                const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                const file_path = path.join(process.cwd(), 'public', `uploads/ticket_attachment/${year}/${month}`);
                if (!fs.existsSync(file_path)) {
                    fs.mkdirSync(file_path, { recursive: true });
                }

                const attachmentPaths = [];
                for (let i = 0; i < attachment.length; i++) {
                    const base64Content = attachment[i].file_content.split(';base64,').pop();
                    const pdfBuffer = Buffer.from(base64Content, 'base64');
                    const fileName = `${newTicket.id}_${i}_${attachment[i].file}`;
                    const fullPath = `${file_path}/${fileName}`;
                    await fsPromises.writeFile(fullPath, pdfBuffer);
                    attachmentPaths.push(`uploads/ticket_attachment/${year}/${month}/${fileName}`);
                }

                if (attachmentPaths.length > 0) {
                    await prisma.ticket_attachment.createMany({
                        data: attachmentPaths.map(p => ({
                            ticket_id: newTicket.id,
                            file_path: p
                        }))
                    });
                }

                const client = newTicket.issuerId
                    ? await prisma.user.findUnique({ where: { userCode: newTicket.issuerId } })
                    : null;

                const staff = await prisma.user.findMany({
                    where: { departmentId: newTicket.departmentId }
                });

                const notiTicket = await prisma.ticket.findUnique({
                    where: { id: newTicket.id },
                    include: { type: true, category: true, department: true }
                });

                // Notify external service
                await fetch(`${process.env.NEXT_PUBLIC_PORT_URL}/notifyy`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: newTicket.id,
                        message: `New Ticket: TL - ${newTicket.title}`,
                        ticketId: newTicket.id,
                        departmentId: newTicket.departmentId,
                        type: 'Ticket Creation',
                        read: 0,
                    }),
                });

                if (staff.length > 0) {
                    await sendClientTicketEmail(notiTicket, staff, client);
                }

            } catch (bgError) {
                console.error("Background task failed:", bgError);
            }
        });

        return { success: true, ticket: newTicket };

    } catch (error) {
        console.error("Error saving ticket:", error);
        const msg = error instanceof ZodError ? error.meta.target : error.message;
        throw new Error(msg || "Failed to add new ticket.");
    }
}

export async function POST(request) {
    const body = await request.json();
    console.log("BODY", body);
    if (body.title === "") {
        return NextResponse.json({ error: { message: "Subject cannot be empty.", details: "Title cannot be empty." }}, { status: 400 });
    } else if (body.description === "") {
        return NextResponse.json({ error: { message: "Message cannot be empty.", details: "Message cannot be empty." }}, { status: 400 });
    } else if ( !body.departmentId ) {
        return NextResponse.json({ error: { message: "Department cannot be empty.", details: "Title cannot be empty." }}, { status: 400 });
    } else if (!body.categoryId) {
        return NextResponse.json({ error: { message: "Category cannot be empty.", details: "Title cannot be empty." }}, { status: 400 });
    } else if (!body.priority) {
        return NextResponse.json({ error: { message: "Priority cannot be empty.", details: "Title cannot be empty." }}, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
       if(body.email) {
            if (!emailRegex.test(body.email)) {
                return NextResponse.json({error: { message :"Invalid email format" }}, {status: 400 });
            }
       }
    
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: { message: 'Missing or invalid Authorization' } }, { status: 401 });
    }
    const token = authHeader.split(' ')[1];
    console.log(body);
    if(token != "null"){
        // let userId; 
        // const idToDecrypt = token.split(':')[0];    
        // const token = authHeader.split(" ")[1];
      
        console.log("TOOOKEN:", token);
        
        // Try getting user data from cache
        let userData = await getUserDataWithCache(token);
        
        if (!userData) {
        console.log("Cache failed, falling back to manual token validation...");
        
        // If cache lookup fails, try userTokenValidation
        const validToken = await userTokenValidation(request);
        if (!validToken) {
          return NextResponse.json({ error: { message: "Missing or invalid Authorization" } }, { status: 401 });
        }
        
        // Extract user ID manually from token decryption
        const userToken = authHeader.split(" ")[1];
        const idToDecrypt = userToken.split(":")[0];
        const decryptedUserId = decrypt(idToDecrypt);
        
        console.log("Decrypted User ID:", decryptedUserId);
        
        if (!decryptedUserId) {
          return NextResponse.json({ error: { message: "Invalid user ID" } }, { status: 400 });
        }
        
        // **Fetch userCode from database**
        const user = await prisma.user.findUnique({
          where: { userCode: decryptedUserId },
          select: { userCode: true },
        });
        
        if (!user) {
          return NextResponse.json({ error: { message: "User not found" } }, { status: 404 });
        }
        
        console.log("HelloUserCode", user.userCode);
        
        // Use `userCode` instead of `id`
        userData = { userCode: user.userCode };
        }
        
        
        console.log("Verified User Data:", userData);
        const userId = userData.userCode || userData.staff_code;
  
          const user = await prisma.user.findUnique({
              where: { userCode: userId },
              include: {
                  teams: {
                      include: {
                          team: true
                      }
                  }
              }
          });
      
        try {
            // userId = decrypt(idToDecrypt); // Attempt to decrypt the user ID
            
            const user = await prisma.user.findUnique({
                where: { userCode: userId },
                include: {
                    teams: {
                        include: {
                            team: {
                                include: {
                                    department: true,
                                    ticketAccess: true,
                                }
                            }
                        }
                    }
                }
            });

            if( user.disabled === 1) {
                return NextResponse.json({ error: { message: 'Unauthorize' } }, { status: 403 });
            }
            if (user) {
                // Perform checks based on userType
                if (["Manager", "Leader", "Employee"].includes(user.userType)) {
                    console.log("Staff",user);
                    // Check if the user has the permission to open a new ticket
                    const canSubmitTicket = user.teams.some(team => team.team.ticketAccess.some(access => access.openNewTicket === 1));
                    if (!canSubmitTicket) {
                        return NextResponse.json({ error: { details: "You do not have permission to submit a ticket." }}, { status: 403 });
                    }
                    body.issuerId = user.userCode;
                }
                console.log(body);

                const valid = await ticketSchema.parseAsync(body);
                if (valid) {
                    const result = await saveTickets(body);

                    if (body.send === 1) {
                        // Fetch the issuer's email
                        const issuer = await prisma.user.findUnique({
                            where: { userCode: body.issuerId }
                        });
                
                        // Ensure you access the ticket id correctly
                        const ticketId = result.ticket?.id;
                
                        if (ticketId && issuer) {
                            // Fetch the complete ticket details including type and category
                            const fullTicketDetails = await prisma.ticket.findUnique({
                                where: { id: ticketId },
                                include: {
                                    type: true,
                                    category: true,
                                },
                            });
                
                            if (fullTicketDetails) {
                                const emailRecipient = {
                                    email: issuer.clientEmail,
                                    username: issuer.username,
                                };
                
                                try {
                                    await sendTicketUpdateEmail(fullTicketDetails, emailRecipient, issuer); // Pass full ticket details
                                } catch (emailError) {
                                    console.error('Failed to send email:', emailError);
                                }
                            } else {
                                console.error('Failed to find ticket with ID:', ticketId);
                            }
                        } else {
                            console.error('Issuer or Ticket ID is missing.');
                        }
                    }
                    // const savedTicket = await response.json();
                     return NextResponse.json(result.ticket, { status: 200 });
                
                    // console.log("Saved", savedTicket);

                  
                
                    if (body.send === 1) {
                        // Fetch the issuer's email
                        const issuer = await prisma.user.findUnique({
                            where: { userCode: body.issuerId }
                        });
                
                        // Ensure you access the ticket id correctly
                        const ticketId = savedTicket.ticket?.id;
                
                        if (ticketId && issuer) {
                            // Fetch the complete ticket details including type and category
                            const fullTicketDetails = await prisma.ticket.findUnique({
                                where: { id: ticketId },
                                include: {
                                    type: true,
                                    category: true,
                                },
                            });
                
                            if (fullTicketDetails) {
                                const emailRecipient = {
                                    email: issuer.clientEmail,
                                    username: issuer.username,
                                };
                
                                try {
                                    await sendTicketUpdateEmail(fullTicketDetails, emailRecipient, issuer); // Pass full ticket details
                                } catch (emailError) {
                                    console.error('Failed to send email:', emailError);
                                }
                            } else {
                                console.error('Failed to find ticket with ID:', ticketId);
                            }
                        } else {
                            console.error('Issuer or Ticket ID is missing.');
                        }
                    }
                
                    // return NextResponse.json(savedTicket.ticket);
                }

            }else{
                return NextResponse.json({ error: { message: "Failed to add new ticket.", details: "Invalid login user" }}, { status: 400 });
        
            }
        } catch (err) {
            console.error('Decryption failed:', err);
            return NextResponse.json({ error: { message: "Failed to add new ticket.", details: "" }}, { status: 400 });
        }
    }
    else{
        return await saveTickets(body);
    }
}

