import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import asyncFC from '../.';

const sleep = (time) => new Promise((res) => setTimeout(res, time, true));

interface SleepingProps {
  id: number;
  duration: number;
}

const Sleeping = asyncFC(
  async ({ duration }: SleepingProps) => {
    await sleep(duration);

    return <h1>Woke up!</h1>;
  }, {
    keySupplier: ({ id }) => `${id}`,
  },
);

const App = () => {
  const [state, setState] = React.useState(0);
  const [id, setID] = React.useState(0);

  const onClick = React.useCallback(() => {
    setState(10000 * Math.random());
    setID(c => c + 1);
  }, []);

  return (
    <div>
      <Sleeping
        duration={state}
        id={id}
        fallback={<h1>Sleeping for {state / 1000} seconds.</h1>}
      />
      <button onClick={onClick}>Go to sleep for 1 to 10 seconds!</button>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
