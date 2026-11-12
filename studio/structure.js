import {BookIcon} from '@sanity/icons/Book'
import {CogIcon} from '@sanity/icons/Cog'
import {HomeIcon} from '@sanity/icons/Home'
import {ImagesIcon} from '@sanity/icons/Images'
import {PinIcon} from '@sanity/icons/Pin'
import {PlayIcon} from '@sanity/icons/Play'
import {TagIcon} from '@sanity/icons/Tag'
import {UserIcon} from '@sanity/icons/User'

const orden = [{field: 'orden', direction: 'asc'}]
const ordenGaleria = [{field: 'ordenGaleria', direction: 'asc'}]

export const structure = (S) =>
  S.list()
    .title('Contenido')
    .items([
      S.listItem()
        .title('Inicio')
        .icon(HomeIcon)
        .child(
          S.list()
            .title('Inicio')
            .items([
              S.documentTypeListItem('diapositivaHero')
                .title('Diapositivas')
                .child(S.documentTypeList('diapositivaHero').title('Diapositivas').defaultOrdering(orden)),
              S.listItem()
                .title('Frase del inicio')
                .id('frase-inicio')
                .child(S.document().schemaType('artista').documentId('artista').title('Frase del inicio')),
            ]),
        ),
      S.documentTypeListItem('serie')
        .title('Series')
        .icon(BookIcon)
        .child(S.documentTypeList('serie').title('Series').defaultOrdering(orden)),
      S.listItem()
        .title('Obras')
        .icon(ImagesIcon)
        .child(
          S.list()
            .title('Obras')
            .items([
              S.listItem()
                .title('Todas')
                .child(S.documentTypeList('obra').title('Todas las obras').defaultOrdering(ordenGaleria)),
              S.listItem()
                .title('Por disciplina')
                .child(
                  S.documentTypeList('disciplina')
                    .title('Elegí una disciplina')
                    .child((id) =>
                      S.documentList()
                        .title('Obras')
                        .filter('_type == "obra" && disciplina._ref == $id')
                        .params({id})
                        .defaultOrdering(ordenGaleria),
                    ),
                ),
              S.listItem()
                .title('Por serie')
                .child(
                  S.documentTypeList('serie')
                    .title('Elegí una serie')
                    .child((id) =>
                      S.documentList()
                        .title('Obras')
                        .filter('_type == "obra" && serie._ref == $id')
                        .params({id})
                        .defaultOrdering([{field: 'ordenEnSerie', direction: 'asc'}]),
                    ),
                ),
            ]),
        ),
      S.documentTypeListItem('disciplina')
        .title('Disciplinas')
        .icon(TagIcon)
        .child(S.documentTypeList('disciplina').title('Disciplinas').defaultOrdering(orden)),
      S.listItem()
        .title('Proyectos artísticos')
        .icon(PinIcon)
        .child(
          S.list()
            .title('Proyectos artísticos')
            .items([
              S.documentTypeListItem('exposicion').title('Exposiciones'),
              S.documentTypeListItem('performance').title('Performances'),
              S.documentTypeListItem('instalacion').title('Instalaciones'),
              S.documentTypeListItem('accion').title('Acciones artísticas'),
            ]),
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
        .child(S.document().schemaType('configuracion').documentId('configuracion').title('Configuración')),
    ])
