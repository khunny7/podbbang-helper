import { useState, useEffect, useCallback } from 'react';
import { FocusZone } from '@fluentui/react/lib/FocusZone';
import { List } from '@fluentui/react/lib/List';
import { Channel } from './channel';

const Ranking = (props) => {
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

    const onRenderCell = useCallback((item) => {
        return (
            <Channel
                title={item.title}
                description={item.description}
                id={item.id}
                image={item.image}
                updatedAt={item.updatedAt} />
        )
    }, [])

    return (
        <FocusZone>
            <List
                items={channels}
                onRenderCell={onRenderCell}
            />
            <p>{next}</p>
            {/* {
                channels.map((channel) => {
                    return (
                        <Channel
                            key={channel.id}
                            title={channel.title}
                            description={channel.description}
                            id={channel.id}
                            image={channel.image}
                            updatedAt={channel.updatedAt} />
                    )
                })
            } */}
        </FocusZone>
    );
};

export { Ranking }