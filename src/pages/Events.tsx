import Layout from "../components/Layout";
import FeatureList from "../components/FeatureList";
import { eventOffers } from "../data";

export default function Events() {
  return (
    <Layout>
      <FeatureList
        heading="Events for every occasion"
        intro="We set up, guide the guests and keep it fun. Everyone leaves with something they made."
        label="Events"
        folder="events"
        offers={eventOffers}
      />
    </Layout>
  );
}