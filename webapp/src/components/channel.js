import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Grid from '@mui/material/Grid';
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

    const onPageChange = useCallback((event, value) => {
        setCurPage(value);
        setOffset(value - 1);
    }, [setCurPage]);

    const totalPageCount = useMemo(() => {
        return Math.ceil(totalCount / pageSize);
    }, [totalCount])

    return (
        <Box>
            <Grid container>
                {
                    episodes.length > 0 &&
                    episodes.map((episode) => {
                        return (
                            <EpisodeListItem
                                key={episode.id}
                                title={episode.title}
                                description={episode.description}
                                id={episode.id}
                                channelId={episode.channel.id}
                                image={episode.image}
                                mediaUrl={episode.media.url}
                                updatedAt={episode.updatedAt} />
                        )
                    })
                }             
            </Grid>
            {
                totalPageCount > 0 && (
                    <Pagination count={totalPageCount} page={curPage} onChange={onPageChange} style={{margin:10}}/>
                )
            }
        </Box>
    );
};

export { Channel }