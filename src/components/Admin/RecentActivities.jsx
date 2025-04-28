import React from 'react';
import { List, ListItem, ListItemText, Typography, Divider } from '@mui/material';
import { Event as EventIcon } from '@mui/icons-material';

const RecentActivities = ({ activities }) => {
  return (
    <List>
      {activities.length === 0 ? (
        <Typography variant="body2" color="textSecondary">
          No recent activities
        </Typography>
      ) : (
        activities.map((activity, index) => (
          <React.Fragment key={index}>
            <ListItem>
              <EventIcon color="action" sx={{ mr: 2 }} />
              <ListItemText
                primary={activity.action}
                secondary={`${activity.timestamp} - ${activity.user}`}
              />
            </ListItem>
            {index < activities.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))
      )}
    </List>
  );
};

export default RecentActivities;