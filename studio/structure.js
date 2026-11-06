import {CogIcon} from '@sanity/icons/Cog'
import {ImagesIcon} from '@sanity/icons/Images'
import {PlayIcon} from '@sanity/icons/Play'
import {UserIcon} from '@sanity/icons/User'

export const structure = (S) =>
  S.list()
    .title('Contenido')
    .items([
      S.documentTypeListItem('obra')
        .title('Obras')
        .icon(ImagesIcon)
        .child(
          S.documentTypeList('obra')
            .title('Obras')
            .defaultOrdering([{field: 'ordenGaleria', direction: 'asc'}]),
        ),
      S.documentTypeListItem('proyectoAudiovisual').title('Audiovisual').icon(PlayIcon),
      S.listItem()
        .title('Sobre la artista')
        .icon(UserIcon)
        .id('artista')
        .child(S.document().schemaType('artista').documentId('artista').title('Sobre la artista')),
      S.listItem()
        .title('Configuración')
        .icon(CogIcon)
        .id('configuracion')
        .child(
          S.document().schemaType('configuracion').documentId('configuracion').title('Configuración'),
        ),
    ])
