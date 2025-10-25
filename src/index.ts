import type { Field, Condition } from 'payload'

type AddressFieldOptions = {
  name?: string
  label?: string
  required?: boolean
  showCoordinates?: boolean
  admin?: {
    condition?: Condition
    description?: string
  }
}

export const addressField = (options: AddressFieldOptions = {}): Field => {
  const {
    name = 'address',
    label = 'Address',
    required = false,
    showCoordinates = true,
    admin = {},
  } = options

  return {
    name,
    type: 'group',
    label,
    admin: {
      ...admin,
      components: {
        Field: {
          path: '@/fields/address/Component#AddressPickerField',
          clientProps: {
            showCoordinates,
          },
        },
      },
    },
    fields: [
      {
        name: 'search',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'lat',
        type: 'number',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'lng',
        type: 'number',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'streetAddress',
        type: 'text',
        label: 'Street Address',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'apartment',
        type: 'text',
        label: 'Apartment, Unit, Suite, etc.',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'city',
        type: 'text',
        label: 'City',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'state',
        type: 'text',
        label: 'State / Province / Emirate',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'postalCode',
        type: 'text',
        label: 'Postal Code',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'country',
        type: 'text',
        label: 'Country',
        required,
        admin: {
          hidden: true,
        },
      },
      {
        name: 'placeId',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
      {
        name: 'formattedAddress',
        type: 'text',
        admin: {
          hidden: true,
        },
      },
    ],
  }
}
