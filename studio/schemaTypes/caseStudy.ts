import { defineField, defineType, defineArrayMember } from 'sanity';

export const caseStudy = defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    // Replace the old 'title' field with these:
    defineField({ name: 'brand', title: 'Brand / Company', type: 'string' }),
    defineField({ name: 'projectType', title: 'Project Type', type: 'string', description: 'e.g., Marketing website' }),
    defineField({ 
      name: 'slug', 
      title: 'Slug', 
      type: 'slug', 
      options: { source: 'brand', maxLength: 96 } // Generates slug from brand name now
    }),
    defineField({ name: 'category', title: 'Category', type: 'string', description: 'e.g., FINTECH, WEB DESIGN' }),
    defineField({ name: 'publishedAt', title: 'Publish Date', type: 'datetime' }),
    defineField({ name: 'isFeatured', title: 'Feature on Home Page?', type: 'boolean', initialValue: false }),
    defineField({ name: 'thumbnail', title: 'Cover Thumbnail', type: 'image', options: { hotspot: true } }),
    
    // NEW METADATA FIELDS
    defineField({ name: 'timeline', title: 'Timeline', type: 'string' }),
    defineField({ name: 'role', title: 'Role', type: 'string' }),
    defineField({ 
      name: 'stack', 
      title: 'Stack', 
      type: 'array', 
      of: [{ type: 'string' }],
      description: 'Add technologies one by one.'
    }),
    defineField({ name: 'summary', title: 'Summary', type: 'text', rows: 4 }),

    // THE PAGE BUILDER
    defineField({
        name: 'contentBlocks',
        title: 'Layout Blocks',
        type: 'array',
        of: [
          defineArrayMember({
            type: 'object', name: 'fullWidthMedia', title: '1-Col (12/12) Media',
            fields: [{ name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' }, { name: 'media', type: 'mediaItem' }]
          }),
          defineArrayMember({
            type: 'object', name: 'halfWidthMedia', title: '1-Col (6/12) Media',
            fields: [
              { name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' },
              { name: 'align', type: 'string', title: 'Alignment', options: { list: ['left', 'right'], layout: 'radio' }, initialValue: 'left' },
              { name: 'media', type: 'mediaItem' }
            ]
          }),
          defineArrayMember({
            type: 'object', name: 'sideBySideMedia', title: '2-Col (6/12) Media',
            fields: [{ name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' }, { name: 'leftMedia', type: 'mediaItem' }, { name: 'rightMedia', type: 'mediaItem' }]
          }),
          defineArrayMember({
            type: 'object', name: 'threeColMedia', title: '3-Col (4/12) Media',
            fields: [{ name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' }, { name: 'media1', type: 'mediaItem' }, { name: 'media2', type: 'mediaItem' }, { name: 'media3', type: 'mediaItem' }]
          }),
          defineArrayMember({
            type: 'object', name: 'halfWidthText', title: '1-Col (5/12) Text',
            fields: [
              { name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' },
              { name: 'align', type: 'string', title: 'Alignment', options: { list: ['left', 'right'], layout: 'radio' }, initialValue: 'left' },
              { name: 'heading', type: 'string', title: 'Block Heading (Optional)' },
              { name: 'text', type: 'text', rows: 4 }
            ]
          }),
          defineArrayMember({
            type: 'object', name: 'sideBySideText', title: '2-Col (5/12) Text',
            fields: [
              { name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' },
              { name: 'leftHeading', type: 'string', title: 'Left Heading (Optional)' },
              { name: 'leftText', type: 'text', rows: 4 },
              { name: 'rightHeading', type: 'string', title: 'Right Heading (Optional)' },
              { name: 'rightText', type: 'text', rows: 4 }
            ]
          }),
          defineArrayMember({
            type: 'object', name: 'threeColText', title: '3-Col (4/12) Text',
            fields: [
              { name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' },
              { name: 'heading1', type: 'string', title: 'Heading 1 (Optional)' }, { name: 'text1', type: 'text', rows: 4 }, 
              { name: 'heading2', type: 'string', title: 'Heading 2 (Optional)' }, { name: 'text2', type: 'text', rows: 4 }, 
              { name: 'heading3', type: 'string', title: 'Heading 3 (Optional)' }, { name: 'text3', type: 'text', rows: 4 }
            ]
          }),
          defineArrayMember({
            type: 'object', name: 'threeItems3ColText', title: '3 Items (3/12) Text',
            fields: [
              { name: 'sectionTitle', type: 'string', title: 'Section Title (Optional)' },
              { name: 'heading1', type: 'string', title: 'Heading 1 (Optional)' }, { name: 'text1', type: 'text', rows: 4 }, 
              { name: 'heading2', type: 'string', title: 'Heading 2 (Optional)' }, { name: 'text2', type: 'text', rows: 4 }, 
              { name: 'heading3', type: 'string', title: 'Heading 3 (Optional)' }, { name: 'text3', type: 'text', rows: 4 }
            ]
          })
        ]
      })
  ]
});