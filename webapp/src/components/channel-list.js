import { useState, useEffect, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { FocusZone } from '@fluentui/react/lib/FocusZone';
import { List } from '@fluentui/react/lib/List';
import { ChannelListItem } from './channel-list-item';

const ChannelList = (props) => {
    const history = useHistory();
    const [channels, setChannels] = useState([]);
    const [next, setNext] = useState();

    useEffect(() => {
        fetch('/api/ranking').then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
            setChannels(data.data);
            setNext(data.next);
        });
    }, [setChannels, setNext]);

    const onChannelSelected = useCallback((channelId) => {
        history.push(`/channel/${channelId}`);
    }, [history]);

    const onRenderCell = useCallback((item) => {
        return (
            <ChannelListItem
                title={item.title}
                description={item.description}
                id={item.id}
                image={item.image}
                updatedAt={item.updatedAt}
                onChannelSelected={onChannelSelected} />
        )
    }, [onChannelSelected]);

    return (
        <FocusZone>
            <List
                items={channels}
                onRenderCell={onRenderCell}
            />
            <p>{next}</p>
        </FocusZone>
    );
};

export default ChannelList;
