import Websocket, {useWebsocket} from './common/Websocket';
import './App.css';

function Home(props) {
    const {connection_id, websocket_channel, websocket_state} = useWebsocket();
    return (<div>
              <div>Connection id: {connection_id}</div>
              <div>Websocket channel: {websocket_channel}</div>
              <div>Websocket state: {websocket_state}</div>

            </div>);
}
function App() {
    return (
        <Websocket>
          <div className="main">
            <div>Now we just have to do something with our life</div>
            <Home/>
          </div>
        </Websocket>
    );
}

export default App;
