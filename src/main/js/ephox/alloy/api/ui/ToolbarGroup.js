define(
  'ephox.alloy.api.ui.ToolbarGroup',

  [
    'ephox.alloy.api.ui.CompositeBuilder',
    'ephox.alloy.parts.PartType',
    'ephox.boulder.api.FieldSchema',
    'ephox.peanut.Fun'
  ],

  function (CompositeBuilder, PartType, FieldSchema, Fun) {
    var schema = [
      FieldSchema.strict('items')
    ];

    var partTypes = [
      PartType.group({ build: Fun.identity }, 'items', 'item', '<alloy.toolbar-group.items>', Fun.constant({ }), Fun.constant({ }))
    ];

    var make = function (detail, components, spec, externals) {
      return {
        uiType: 'custom',
        uid: detail.uid(),
        dom: detail.dom(),
        components: components
      };
    };

    var build = function (spec) {
      return CompositeBuilder.build('toolbar-group', schema, partTypes, make, spec);
    };

    // TODO: Remove likely dupe
    var parts = PartType.generate('toolbar-group', partTypes);

    return {
      build: build,
      parts: Fun.constant(parts)
    };
  }
);