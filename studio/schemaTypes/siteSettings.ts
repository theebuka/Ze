import {defineType, defineField} from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'heroImage',
      title: 'Hero Image',
      type: 'image',
    }),
    defineField({
      name: 'aboutImage1',
      title: 'About Image 1',
      type: 'image',
    }),
    defineField({
      name: 'aboutImage2',
      title: 'About Image 2',
      type: 'image',
    }),
  ],
})
