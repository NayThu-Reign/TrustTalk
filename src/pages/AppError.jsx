import ErrorPage from "../components/ErrorPage";

export default function AppError() {
  return (
    <ErrorPage
      title="Unexpected Error"
      subtitle="Something went wrong"
      message="Please contact +959420188813 to help our developers find and fix this issue quickly."
      showBack={false}
    />
  );
}
