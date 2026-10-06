import TextPage from "../components/TextPage";

export default function Terms() {
  return (
    <TextPage
      title="Terms of service"
      intro="The simple ground rules for booking a SmartArt254 session."
      sections={[
        {
          heading: "Bookings",
          body: "A booking request is confirmed only after our team contacts you and agrees the date, activity, number of guests and price.",
        },
        {
          heading: "Supplies and guidance",
          body: "Our hosts bring the supplies and guide each activity. Finished pieces belong to the guests who make them.",
        },
        {
          heading: "Children and supervision",
          body: "Sessions with children need a responsible adult or teacher present throughout.",
        },
        {
          heading: "Changes and cancellations",
          body: "Please tell us as early as possible if you need to change or cancel. Terms for each booking are agreed when it is confirmed.",
        },
      ]}
    />
  );
}