import Layout from "../components/Layout";
import FeatureList from "../components/FeatureList";
import { workshopOffers } from "../data";

export default function Workshops() {
  return (
    <Layout>
      <FeatureList
        heading="Art workshops and crafts"
        intro="Pick one activity or mix several in a single session."
        label="Workshops"
        folder="workshops"
        offers={workshopOffers}
      />
    </Layout>
  );
}