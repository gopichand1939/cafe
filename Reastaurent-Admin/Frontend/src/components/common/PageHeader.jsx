import { PageSection } from "../ui";

function PageHeader({ title, subtitle, actions, eyebrow = "Admin Panel" }) {
  return (
    <PageSection
      title={title}
      subtitle={subtitle}
      actions={actions}
      eyebrow={eyebrow}
    />
  );
}

export default PageHeader;
