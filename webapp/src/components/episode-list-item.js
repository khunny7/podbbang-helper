import { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Stack } from '@fluentui/react';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import IconButton from '@mui/material/IconButton';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import QueueIcon from '@mui/icons-material/Queue';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AudioListsContext from '../audio-list-context';

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

    const {
        audioLists,
        setAudioListsWithClear,
    } = useContext(AudioListsContext);

    const onPlay = useCallback(() => {
        setAudioListsWithClear([{
            cover: image,
            musicSrc: mediaUrl,
            name: title,
            singer: 'TO DO',
        }], true);
    }, [setAudioListsWithClear, image, mediaUrl, title]);

    const onAddAudio = useCallback(() => {
        const updatedAudioLists = [
            ...audioLists,
            {
                cover: image,
                musicSrc: mediaUrl,
                name: title,
                singer: 'TO DO',
            },
        ];

        setAudioListsWithClear(updatedAudioLists, false);
    }, [setAudioListsWithClear, audioLists, image, mediaUrl, title]);

    const classNames = mergeStyleSets({
        itemCell: {
            height: 100,
            width: '100%',
            margin: 5,
            border: 'solid',
            borderWidth: 'thin',
        },
        episodeImage: {
            height: 100,
        },        
        title: {
            fontWeight: 600,
            margin: 2,
        },
        description: {
            fontWeight: 400,
            margin: 2,
        },
    });

    return (
        <Stack
            horizontal
            disableShrink
            className={classNames.itemCell}>
            <Stack.Item align='auto'>
                <img src={image} alt={title} className={classNames.episodeImage}/>
            </Stack.Item>
            <Stack.Item align='auto'>
                <p className={classNames.title}>{title}</p>
                <p className={classNames.description}>{description}</p>
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
            </Stack.Item>
        </Stack>
    );
};

EpisodeListItem.propTypes = {
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    id: PropTypes.number.isRequired,
    image: PropTypes.string.isRequired,
    // updatedAt: PropTypes.string.isRequired,
};

export { EpisodeListItem }