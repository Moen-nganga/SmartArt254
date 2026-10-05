import Layout from "../components/Layout";
import Section from "../components/Section";
import { eventOffers } from "../data";

export default function Events() {
  return (
    <Layout>
      <div className="pt-6">
        <Section
          heading="Events"
          intro="Art for the occasions that matter, hosted by the SmartArt254 team."
          offers={eventOffers}
        />
      </div>
    </Layout>
  );
}