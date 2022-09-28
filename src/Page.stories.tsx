import React from "react";

import { Page } from "./Page";

export default {
  title: "Example/Page",
  component: Page,
};

const Template = (args: {}) => <Page {...args} />;
export const Default = Template.bind({});
