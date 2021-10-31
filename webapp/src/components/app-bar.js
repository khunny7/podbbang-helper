import { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import HomeIcon from '@mui/icons-material/Home';
import { useHistory } from 'react-router-dom';
import NavContext from '../nav-context';

const HeaderAppBar = () => {
    const history = useHistory();
    const { currentPage } = useContext(NavContext);

    return (
        <AppBar position="fixed">
            <Toolbar>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={() => {
                    history.push('/');
                }}
            >
                <HomeIcon />
            </IconButton>
            <Breadcrumbs aria-label='breadcrumb'>
                <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#FFFFFF' }}>
                    { currentPage }
                </Typography>
            </Breadcrumbs>
            {/* <Button color="inherit">Login</Button> */}
            </Toolbar>
        </AppBar>
    )    
};

export default HeaderAppBar;
