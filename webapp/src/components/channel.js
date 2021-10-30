import { useState, useEffect, useCallback } from 'react';
import { FocusZone } from '@fluentui/react/lib/FocusZone';
import { List } from '@fluentui/react/lib/List';
import { useParams  } from 'react-router-dom';
import { EpisodeListItem } from './episode-list-item';

const Channel = (props) => {
    const { channelId } = useParams();

    const [episodes, setEpisodes] = useState([]);
    const [offset, setOffset] = useState();

    useEffect(() => {
        fetch(`/api/channel/${channelId}`).then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
            setEpisodes(data.data);
            setOffset(data.offset);
        });
    }, [channelId, setEpisodes, setOffset]);

    const onRenderCell = useCallback((item) => {
        return (
            <EpisodeListItem
                title={item.title}
                description={item.description}
                id={item.id}
                channelId={item.channel.id}
                image={item.image}
                mediaUrl={item.media.url}
                updatedAt={item.updatedAt} />
        )
    }, [])

    return (
        <FocusZone>
            <List
                items={episodes}
                onRenderCell={onRenderCell}
            />
            <p>{offset}</p>
        </FocusZone>
    );
};

export { Channel }