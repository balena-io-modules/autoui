# AutoUI

A library of UI components, built using [React][react], [styled-components][styled-components] to allow building a UI just using a model.

## Table of Contents

* [Installation](#installation)
* [Usage](#usage)
* [Development](#development)
* [Testing](#testing)
* [Upgrading](#testing)

## Installation

```
npm install --save autoui
```

## Usage

Wrap your application in the `AutoUIProvider` component and start using components!

```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { AutoUIProvider } from 'autoui';
import {
	AutoUIBaseResource,
	AutoUIRawModel,
	autoUIDefaultPermissions,
	autoUIJsonSchemaPick,
  autoUIRunTransformers,
  autoUIGetModelForCollection,
} from 'autoui';


type AugmentedRelease = AutoUIBaseResource<{}>

interface EntityType {
  id: number,
  name: string,
  surname: string,
}

const observerPermissions = {
	read: [
		'id',
		'name',
		'surname',
	],
	create: [],
	update: [],
	delete: false,
};

const adminPermissions = {
	...observerPermissions,
	create: ['name'],
	update: ['name'],
	delete: true,
};

const model = {
  resource: 'user',
  schema: {
    type: 'object',
    required: [],
    properties: {
      id: {
        title: 'Id',
        type: 'number',
      },
      name: {
        title: 'Name',
        type: 'string',
      },
      surname: {
        title: 'Surname',
        type: 'string',
      },
    },
  },
  permissions: {
    default: autoUIDefaultPermissions,
    administrator: adminPermissions,
    developer: adminPermissions,
    member: autoUIDefaultPermissions,
    operator: observerPermissions,
    observer: observerPermissions,
    support_agent: observerPermissions,
    balena_admin: observerPermissions,
  },
  priorities: {
    primary: ['name'],
    secondary: [
      'surname',
      'id',
    ],
    tertiary: [],
  },
} as AutoUIRawModel<Partial<AugmentedRelease>>;

// where the UI can add new properties, but this will be removed soon as everything should live in the model
const transformers = {
	__permissions: (entity: BalenaSdk.Release, context: any) => {
		return model(getExpanded(entity.belongs_to__application)?.is_of__class!)
			.permissions[context.accessRole ?? 'default'];
	},
};

const App = () => {

  const data = [
    {
        "id": 2313948,
        "name": "John",
        "surname": "Smith",
    },
    {
        "id": 2307403,
        "name": "Robert",
        "surname": "Taylor",
    }
  ]

  const memoizedData = React.useMemo(() => {
		return autoUIRunTransformers(data, transformers, {});
	}, [data]);

	const memoizedModel = React.useMemo(() => {
		return autoUIGetModelForCollection(model);
	}, [model]);

	return <AutoUIProvider>
    <AutoUI<EntityType>
      data={data}
      model={model}
    />
  </AutoUIProvider>
};

ReactDOM.render(
  <App/>,
  document.getElementById('root')
);
```

### Provider

Wrap your application in the `<Provider>` component so that child components can correctly inherit the following properties: 
  - `t`: used for translations (expected lib `i18n-next`)
  - `history`: used to allow persistent filters. (expected lib `history`)

## Contributing

Please read our [contribution guidelines](docs/CONTRIBUTING.md)

[react]:https://reactjs.org/
[i18n-next]:https://react.i18next.com/
[history]:https://v5.reactrouter.com/web/api/history
