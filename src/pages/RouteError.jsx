import { useRouteError } from "react-router-dom";
import ErrorPage from "../components/ErrorPage";

export default function RouteError() {
  const error = useRouteError();
  console.error("Route error:", error);

  return (
    <ErrorPage
      title="Unexpected Error"
      subtitle="Something went wrong"
      message="Please contact +959420188813  to help our developers fix this quickly."
      showBack={false}
    />
  );
}
