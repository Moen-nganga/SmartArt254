import TextPage from "../components/TextPage";

export default function Privacy() {
  return (
    <TextPage
      title="Privacy policy"
      intro="How SmartArt254 handles the information you share with us."
      sections={[
        {
          heading: "What we collect",
          body: "When you make a booking we collect your name, email address, phone number, the activity you want, your preferred date and the number of guests.",
        },
        {
          heading: "How we use it",
          body: "We use your details only to confirm your booking, plan your session and contact you about it. We do not sell your information.",
        },
        {
          heading: "Where it is stored",
          body: "Booking details are stored in a secure cloud database. Messages sent through WhatsApp are handled by WhatsApp under its own policy.",
        },
        {
          heading: "Your choices",
          body: "You can ask us to correct or delete your details at any time by messaging us on WhatsApp.",
        },
      ]}
    />
  );
}