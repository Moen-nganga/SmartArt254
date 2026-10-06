import TextPage from "../components/TextPage";

export default function Blog() {
  return (
    <TextPage
      title="Blog"
      intro="Art ideas, event tips and stories from our sessions."
      sections={[
        {
          heading: "Coming soon",
          body: "We are putting our first posts together. Check back soon, or message us on WhatsApp to ask about an activity.",
        },
      ]}
    />
  );
}