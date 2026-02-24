import { Box, Typography } from '@mui/material';

export default function LoadingBar (){
  const totalSteps = 15;
  const filledSteps = 10; // You can set this dynamically for animation

  return (
    <Box display="flex" flexDirection="column" alignItems="center" mt={5}>
      <Typography variant="h5" fontWeight="bold" color="primary" mb={2}>
        LOADING...
      </Typography>
      <Box
        display="flex"
        border="2px solid #00BFFF"
        borderRadius="8px"
        overflow="hidden"
        width="300px"
        height="24px"
      >
        {[...Array(totalSteps)].map((_, index) => (
          <Box
            key={index}
            flex="1"
            sx={{
              backgroundColor: index < filledSteps ? '#00BFFF' : 'transparent',
              borderRight: index !== totalSteps - 1 ? '1px solid #00BFFF' : 'none',
              transition: 'background-color 0.3s',
            }}
          />
        ))}
      </Box>
    </Box>
  );
};
