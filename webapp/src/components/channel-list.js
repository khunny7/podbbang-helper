import { useState, useEffect, useCallback, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import NavContext from '../nav-context';
import { getRepository } from '../data/repository';

const ChannelList = (props) => {
    const history = useHistory();
    const [channels, setChannels] = useState([]);
    const [next, setNext] = useState();
    const { setCurrentPage } = useContext(NavContext);

    useEffect(() => {
        getRepository()
        .getChannels()
        .then((data) => {
            console.log(data);
            setChannels(data.data);
            setNext(data.next);
        });
    }, [setChannels, setNext]);

    useEffect(() => {
        setCurrentPage('Channels');
    }, [setCurrentPage]);

    const onChannelSelected = useCallback((channel) => {
        setCurrentPage(channel.title);
        history.push(`/channel/${channel.id}`);
    }, [history, setCurrentPage]);

    return (
        <Box>
            {
                channels.length > 1 &&
                channels.map((channel) =>
                    (
                        <Card sx={{ display: 'flex', margin: 1 }} key={channel.id} onClick={() => onChannelSelected(channel)}>
                            <CardMedia
                                component="img"
                                sx={{ width: 100, height: 100 }}
                                image={channel.image}
                                alt={channel.title}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flex: '1 0 auto', padding: '8px' }}>
                                    <Typography component="div" variant="h8">
                                        { channel.title }
                                    </Typography>
                                    <Typography variant="subtitle2" color="text.secondary" component="div" sx={{ maxHeight: 40 }}>
                                        { channel.description }
                                    </Typography>
                                </CardContent>
                            </Box>
                        </Card>
                    )
                )
            }
            <p>{next}</p>
        </Box>
    );
};

export default ChannelList;
