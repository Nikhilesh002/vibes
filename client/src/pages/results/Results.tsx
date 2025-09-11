import { useLocation } from 'react-router-dom';

function Results() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get('query');

  return <div>Results for: {query}</div>;
}

export default Results;
