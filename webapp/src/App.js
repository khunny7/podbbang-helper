import { BrowserRouter, Route } from 'react-router-dom';
import { Ranking } from './components/ranking';
import { Channel } from './components/channel';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Route path='/' exact component={Ranking} />
        <Route path='/channel/:channelId' exact component={Channel} />
      </BrowserRouter>
    </div>
  );
}

export default App;
