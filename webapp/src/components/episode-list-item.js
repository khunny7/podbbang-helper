import { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QueueIcon from '@mui/icons-material/Queue';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AudioListsContext from '../audio-list-context';
import NavContext from '../nav-context';

const EpisodeListItem = (props) => {
    const {
        title,
        description,
        // id,
        // channelId,
        image,
        mediaUrl,
        // updatedAt,
    } = props;

    const { currentPage } = useContext(NavContext);

    const {
        audioLists,
        setAudioListsWithClear,
    } = useContext(AudioListsContext);

    const onPlay = useCallback(() => {
        setAudioListsWithClear([{
            cover: image,
            musicSrc: mediaUrl,
            name: title,
            singer: currentPage,
        }], true);
    }, [setAudioListsWithClear, image, mediaUrl, title, currentPage]);

    const onAddAudio = useCallback(() => {
        const updatedAudioLists = [
            ...audioLists,
            {
                cover: image,
                musicSrc: mediaUrl,
                name: title,
                singer: currentPage,
            },
        ];

        setAudioListsWithClear(updatedAudioLists, false);
    }, [setAudioListsWithClear, audioLists, image, mediaUrl, title, currentPage]);

    return (
        <Card sx={{ width: 345 }} style={{margin:5}}>
            {
                image && 
                (
                    <CardMedia
                        component="img"
                        image={image}
                        alt={title}
                    />
                )
            }
            <CardContent>
                <Typography gutterBottom variant="h9" component="div">
                    {title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {description}
                </Typography>
            </CardContent>
            <CardActions>
                <IconButton aria-label="play" color="primary" onClick={onPlay}>
                     <PlayCircleOutlineIcon />
                 </IconButton>
                 <IconButton color="secondary" aria-label="add to qeueue" onClick={onAddAudio}>
                     <QueueIcon />
                 </IconButton>
                 <IconButton color="secondary" aria-label="download file">
                     <a href={mediaUrl} download target='_blank' rel='noreferrer'>
                         <AttachFileIcon />
                     </a>
                 </IconButton>
            </CardActions>
        </Card>
    );
};

EpisodeListItem.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    image: PropTypes.string,
    // updatedAt: PropTypes.string.isRequired,
};

EpisodeListItem.defaultProps = {
    image: null,
}

export { EpisodeListItem }