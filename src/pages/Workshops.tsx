import Layout from "../components/Layout";
import Section from "../components/Section";
import { workshopOffers } from "../data";

export default function Workshops() {
  return (
    <Layout>
      <div className="pt-6">
        <Section
          heading="Workshops"
          intro="Pick a craft. Our host brings the supplies and guides everyone through it."
          offers={workshopOffers}
        />
      </div>
    </Layout>
  );
}