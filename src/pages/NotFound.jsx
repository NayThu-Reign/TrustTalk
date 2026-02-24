import ErrorPage from "../components/ErrorPage";


export default function NotFound() {
  return (
    <ErrorPage
      title="Oops!"
      subtitle="404 Page Not Found"
      message="You Gotta Do What You Gotta Do"
    />
  );
}
