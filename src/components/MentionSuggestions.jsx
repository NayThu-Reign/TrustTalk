import { Popper, Paper, Autocomplete, TextField, ListItem, ListItemText } from "@mui/material";
import { memo } from "react";

const MentionSuggestions = memo(({ anchorEl, participants, onSelect }) => (
    <Popper
        open={!!anchorEl}
        anchorEl={anchorEl}
        placement="top-start"
        sx={{ zIndex: 9999 }}
    >
        <Paper sx={{ 
            width: 300, 
            maxHeight: 200, 
            overflow: 'auto',
            '& .mention-item': {
                color: '#1976d2',
                fontWeight: 500
            }
        }}>
            <Autocomplete
                options={[
                    { type: 'all', label: '@All - Notify everyone', userfullname: 'all' },
                    ...participants
                ]}
                filterOptions={(options, state) => 
                    options.filter(opt => 
                        opt.label.toLowerCase().includes(state.inputValue.toLowerCase())
                    )
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        autoFocus
                        placeholder="Search participants..."
                        variant="outlined"
                        size="small"
                        sx={{ p: 1 }}
                    />
                )}
                renderOption={(props, option) => (
                    <ListItem 
                        {...props}
                        className="mention-item"
                        onClick={() => onSelect(option.type === 'all' ? 'all' : option.userfullname)}
                    >
                        <ListItemText
                            primary={option.label}
                            primaryTypographyProps={{
                                sx: {
                                    color: option.type === 'all' ? '#d84315' : 'inherit',
                                    fontWeight: option.type === 'all' ? 600 : 'normal'
                                }
                            }}
                        />
                    </ListItem>
                )}
            />
        </Paper>
    </Popper>
));

export default MentionSuggestions;