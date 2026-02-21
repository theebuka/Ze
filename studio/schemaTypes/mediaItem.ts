import { defineField, defineType } from 'sanity';

export const mediaItem = defineType({
  name: 'mediaItem',
  title: 'Media Item',
  type: 'object',
  fields: [
    defineField({
      name: 'mediaType',
      title: 'Media Type',
      type: 'string',
      options: {
        list: [
          { title: 'Image / GIF', value: 'image' },
          { title: 'Video (URL)', value: 'video' }
        ],
        layout: 'radio'
      },
      initialValue: 'image'
    }),
    defineField({
      name: 'image',
      title: 'Image / GIF',
      type: 'image',
      options: { hotspot: true }, // Allows precise cropping in the CMS
      hidden: ({ parent }) => parent?.mediaType !== 'image'
    }),
    defineField({
      name: 'videoUrl',
      title: 'Video URL (Vimeo/Raw MP4)',
      type: 'url',
      hidden: ({ parent }) => parent?.mediaType !== 'video'
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional editorial caption.'
    })
  ]
});