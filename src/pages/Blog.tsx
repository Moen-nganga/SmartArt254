import TextPage from "../components/TextPage";

export default function Blog() {
  return (
    <TextPage
      title="Blog"
      intro="Art ideas, event tips and stories from our sessions."
      sections={[
        {
          heading: "Coming soon",
          body: "Blogs from our recent art events and conventions will be regulalry updated here.",
        },
      ]}
    />
  );
}