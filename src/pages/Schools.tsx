import Layout from "../components/Layout";
import Section from "../components/Section";
import { schoolOffers } from "../data";

export default function Schools() {
  return (
    <Layout>
      <div className="pt-6">
        <Section
          heading="For schools"
          intro="Programmes that fit the timetable and get every learner making."
          offers={schoolOffers}
        />
      </div>
    </Layout>
  );
}