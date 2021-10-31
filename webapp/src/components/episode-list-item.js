import { useContext, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Stack } from '@fluentui/react';
import { mergeStyleSets } from '@fluentui/react/lib/Styling';
import AudioListsContext from '../audio-list-context';

const EpisodeListItem = (props) => {
    const {
        title,
        description,
        id,
        // channelId,
        image,
        mediaUrl,
        // updatedAt,
    } = props;

    const {
        playAudio,
        addAudio,
    } = useContext(AudioListsContext);

    const onPlay = useCallback(() => {
        playAudio({
            cover: image,
            musicSrc: mediaUrl,
            name: title,
            singer: 'TO DO',
        });
    }, [playAudio, image, mediaUrl, title]);

    const onAddAudio = useCallback(() => {
        addAudio({
            cover: image,
            musicSrc: mediaUrl,
            name: title,
            singer: 'TO DO',
        });
    }, [addAudio, image, mediaUrl, title]);

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
                <p>{title}</p>
                <p>{description}</p>
                <a href={mediaUrl} download target='_blank' rel='noreferrer'>Download</a>
                <button onClick={onPlay}>Play</button>
                <button onClick={onAddAudio}>Queue</button>
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