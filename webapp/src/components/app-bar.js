import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import HomeIcon from '@mui/icons-material/Home';
import { useHistory } from 'react-router-dom';

const HeaderAppBar = () => {
    const history = useHistory();

    return (
        <AppBar position="fixed">
            <Toolbar>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => { history.push('/')}}
            >
                <HomeIcon />
            </IconButton>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                Home
            </Typography>
            {/* <Button color="inherit">Login</Button> */}
            </Toolbar>
        </AppBar>
    )    
};

export default HeaderAppBar;
