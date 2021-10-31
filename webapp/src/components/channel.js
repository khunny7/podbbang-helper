import { useState, useEffect, useCallback, useMemo } from 'react';
import { FocusZone } from '@fluentui/react/lib/FocusZone';
import { List } from '@fluentui/react/lib/List';
import Pagination from '@mui/material/Pagination';
import { useParams  } from 'react-router-dom';
import { EpisodeListItem } from './episode-list-item';

const pageSize = 20;

const Channel = (props) => {
    const { channelId } = useParams();

    const [episodes, setEpisodes] = useState([]);
    const [offset, setOffset] = useState(0);
    const [curPage, setCurPage] = useState(1);
    const [totalCount, setTotalCount] = useState();

    useEffect(() => {
        fetch(`/api/channel/${channelId}?offset=${offset}`).then((res) => {
            return res.json();
        }).then((data) => {
            console.log(data);
            setEpisodes(data.data);
            setOffset(data.offset);

            if (data.summary && data.summary.totalCount) {
                setTotalCount(data.summary.totalCount);
            }            
        });
    }, [channelId, offset, setEpisodes, setOffset]);

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
    }, []);

    const onPageChange = useCallback((event, value) => {
        setCurPage(value);
        setOffset(value - 1);
    }, [setCurPage]);

    const totalPageCount = useMemo(() => {
        return Math.ceil(totalCount / pageSize);
    }, [totalCount])

    return (
        <FocusZone>
            <List
                items={episodes}
                onRenderCell={onRenderCell}
            />
            {
                totalPageCount > 0 && (
                    <Pagination count={totalPageCount} page={curPage} onChange={onPageChange} />
                )
            }            
        </FocusZone>
    );
};

export { Channel }