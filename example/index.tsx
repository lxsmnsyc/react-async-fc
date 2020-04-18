import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import asyncFC from '../.';

interface SleepingProps {
  id: number;
  duration: number;
}

const Sleeping = asyncFC<SleepingProps>(
  async ({ duration }, subscription) => {
    await new Promise((res) => {
      const timeout = setTimeout(res, duration, true)

      subscription.addListener(() => {
        clearTimeout(timeout);
      });
    });

    return <h1>Woke up!</h1>;
  }, {
    dependencies: ({ id }) => [id],
    suspense: true,
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
        fallback={<h1>Sleeping for {(state / 1000).toFixed(2)} seconds.</h1>}
      />
      <button onClick={onClick}>Go to sleep for 1 to 10 seconds!</button>
      <p>Current render id: {id}</p>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
