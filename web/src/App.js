import Websocket from './common/Websocket';
import './App.css';

function Home(props) {
    console.log(props);
    return 'Take me home';
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
