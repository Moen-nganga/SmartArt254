import Layout from "../components/Layout";
import FeatureList from "../components/FeatureList";
import { schoolOffers } from "../data";

export default function Schools() {
  return (
    <Layout>
      <FeatureList
        heading="For schools"
        intro="Programmes that fit the timetable and get every learner making."
        label="Schools"
        folder="schools"
        offers={schoolOffers}
      />
    </Layout>
  );
}