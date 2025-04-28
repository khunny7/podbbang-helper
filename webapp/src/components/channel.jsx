import { useContext, useEffect,React } from 'react';
import Box from '@mui/material/Box';
import Pagination from '@mui/material/Pagination';
import Grid from '@mui/material/Grid';
import NavContext from '../contexts/nav-context';
import { EpisodeListItem } from './episode-list-item';
import SearchBar from './search-bar';
import { useChannel } from '../hooks/use-channel';

const Channel = (props) => {
  const {
    episodes,
    curPage,
    totalPageCount,
    channelInfo,
    onPageChange,
    onSearch,
  } = useChannel();

  const { setCurrentPage } = useContext(NavContext);

  useEffect(() => {
    if (channelInfo) {
      setCurrentPage(channelInfo.title);
    }
  }, [channelInfo, setCurrentPage]);

  return (
    <Box>
      <SearchBar onSearch={onSearch} />
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
          <Pagination count={totalPageCount} page={curPage} onChange={onPageChange} style={{ margin: 10 }} />
        )
      }
    </Box>
  );
};

export { Channel }