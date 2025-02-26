import { ApproxStructure, Mouse } from '@ephox/agar';
import { context, describe, it } from '@ephox/bedrock-client';
import { Arr, Fun } from '@ephox/katamari';
import { Html, SelectorFilter, SelectorFind } from '@ephox/sugar';
import { TinyAssertions, TinyDom, TinyHooks, TinySelections, TinyState } from '@ephox/wrap-mcagar';

import Editor from 'tinymce/core/api/Editor';

import { annotate, assertHtmlContent } from '../../module/test/AnnotationAsserts';

describe('browser.tinymce.core.annotate.AnnotateTest', () => {
  const hook = TinyHooks.bddSetupLight<Editor>({
    base_url: '/project/tinymce/js/tinymce',
    setup: (ed: Editor) => {
      ed.on('init', () => {
        ed.annotator.register('test-annotation', {
          decorate: (uid, data) => ({
            attributes: {
              'data-test-anything': data.anything
            },
            classes: [ ]
          })
        });
      });

      ed.mode.register('testMode', {
        activate: Fun.noop,
        deactivate: Fun.noop,
        editorReadOnly: {
          uiEnabled: false,
          selectionEnabled: true,
        },
      });
    }
  }, [], true);

  Arr.each([
    { label: 'Normal mode', before: () => hook.editor().mode.set('design'), after: Fun.noop, mode: 'normal' },
    { label: 'Cursor mode', before: () => hook.editor().mode.set('design'), after: () => hook.editor().mode.set('testMode'), mode: 'testMode' },
  ], (modeScenario) => {
    context(modeScenario.label, () => {
      const modeTestSetContent = (editor: Editor, content: string) => {
        modeScenario.before();
        editor.setContent(content);
        modeScenario.after();
      };

      // TODO: Consider testing collapse sections.
      it('should word grab with a collapsed selection', () => {
        const editor = hook.editor();
        // '<p>This |is| the first paragraph</p><p>This is the second.</p>'
        modeTestSetContent(editor, '<p>This is the first paragraph here</p><p>This is the second.</p>');
        TinySelections.setSelection(editor, [ 0, 0 ], 'This is the first p'.length, [ 0, 0 ], 'This is the first p'.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'one-paragraph' });
        assertHtmlContent(editor, [
          '<p>This is the first <span data-test-anything="one-paragraph" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation">paragraph</span> here</p>',
          '<p>This is the second.</p>'
        ]);

        TinyAssertions.assertSelection(editor, [ 0 ], 1, [ 0 ], 2);
      });

      it('should be able to annotate a direct parent of the body (e.g. an empty paragraph)', () => {
        const editor = hook.editor();
        modeTestSetContent(editor, '<p>First</p><p><br/></p><p>Third</p>');
        TinySelections.setSelection(editor, [ 1 ], 0, [ 1 ], 0);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'empty-paragraph' });
        assertHtmlContent(editor, [
          '<p>First</p>',
          '<p><span data-test-anything="empty-paragraph" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation"><br /></span></p>',
          '<p>Third</p>'
        ]);
      });

      it('should annotate when the cursor is collapsed before two nbsps', () => {
        const editor = hook.editor();
        modeTestSetContent(editor, '<p>Annotation here &nbsp;&nbsp;, please</p>');
        TinySelections.setCursor(editor, [ 0, 0 ], 'Annotation here '.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'nbsp-paragraph' });
        TinyAssertions.assertContentStructure(
          editor,
          ApproxStructure.build((s, str, arr) => s.element('body', {
            children: [
              s.element('p', {
                children: [
                  s.text(str.is('Annotation here ')),
                  s.element('span', {
                    classes: [ arr.has('mce-annotation') ],
                    html: str.is('&nbsp;')
                  }),
                  s.text(str.is('\u00A0\u00A0, please'))
                ]
              })
            ]
          }))
        );
      });

      it('should annotate when the cursor is collapsed between two nbsps', () => {
        const editor = hook.editor();
        modeTestSetContent(editor, '<p>Annotation here &nbsp;&nbsp;, please</p>');
        TinySelections.setCursor(editor, [ 0, 0 ], 'Annotation here  '.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'nbsp-paragraph' });
        TinyAssertions.assertContentStructure(
          editor,
          ApproxStructure.build((s, str, arr) => s.element('body', {
            children: [
              s.element('p', {
                children: [
                  s.text( str.is('Annotation here \u00A0') ),
                  s.element('span', {
                    classes: [ arr.has('mce-annotation') ],
                    html: str.is('&nbsp;')
                  }),
                  s.text( str.is('\u00A0, please'))
                ]
              })
            ]
          }))
        );
      });

      it('should annotate when the cursor is collapsed after two nbsps', () => {
        const editor = hook.editor();
        modeTestSetContent(editor, '<p>Annotation here &nbsp;&nbsp;, please</p>');
        TinySelections.setCursor(editor, [ 0, 0 ], 'Annotation here   '.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'nbsp-paragraph' });
        TinyAssertions.assertContentStructure(
          editor,
          ApproxStructure.build((s, str, arr) => s.element('body', {
            children: [
              s.element('p', {
                children: [
                  s.text(str.is('Annotation here \u00A0\u00A0')),
                  s.element('span', {
                    classes: [ arr.has('mce-annotation') ],
                    html: str.is(',')
                  }),
                  s.text(str.is(' please'))
                ]
              })
            ]
          }))
        );
      });

      it('should not word grab if the selection is not collapsed', () => {
        const editor = hook.editor();
        // '<p>This |is| the first paragraph</p><p>This is the second.</p>'
        modeTestSetContent(editor, '<p>This is the first paragraph</p><p>This is the second.</p>');
        TinySelections.setSelection(editor, [ 0, 0 ], 'This is the first p'.length, [ 0, 0 ], 'This is the first par'.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'one-paragraph' });
        assertHtmlContent(editor, [
          '<p>This is the first p<span data-test-anything="one-paragraph" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation">ar</span>agraph</p>',
          '<p>This is the second.</p>'
        ]);

        TinyAssertions.assertSelection(editor, [ 0 ], 1, [ 0 ], 2);
      });

      it('testing in one paragraph', () => {
        const editor = hook.editor();
        // '<p>This |is| the first paragraph</p><p>This is the second.</p>'
        modeTestSetContent(editor, '<p>This is the first paragraph</p><p>This is the second.</p>');
        TinySelections.setSelection(editor, [ 0, 0 ], 'This '.length, [ 0, 0 ], 'This is'.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'one-paragraph' });
        assertHtmlContent(editor, [
          '<p>This <span data-test-anything="one-paragraph" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation">is</span> the first paragraph</p>',
          '<p>This is the second.</p>'
        ]);

        TinyAssertions.assertSelection(editor, [ 0 ], 1, [ 0 ], 2);
      });

      it('testing over two paragraphs', () => {
        const editor = hook.editor();
        // '<p>This |is the first paragraph</p><p>This is| the second.</p>'
        modeTestSetContent(editor, '<p>This is the first paragraph</p><p>This is the second.</p>');
        TinySelections.setSelection(editor, [ 0, 0 ], 'This '.length, [ 1, 0 ], 'This is'.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'two-paragraphs' });
        assertHtmlContent(editor, [
          '<p>This <span data-mce-annotation="test-annotation" data-test-anything="two-paragraphs" data-mce-annotation-uid="test-uid" class="mce-annotation">is the first paragraph</span></p>',
          '<p><span data-mce-annotation="test-annotation" data-test-anything="two-paragraphs" data-mce-annotation-uid="test-uid" class="mce-annotation">This is</span> the second.</p>'
        ]);
        TinyAssertions.assertSelection(editor, [ 0 ], 1, [ 1 ], 1);
      });

      it('testing over three paragraphs', () => {
        const editor = hook.editor();
        // '<p>This |is the first paragraph</p><p>This is the second.</p><p>This is| the third.</p>'
        modeTestSetContent(editor, '<p>This is the first paragraph</p><p>This is the second.</p><p>This is the third.</p>');
        TinySelections.setSelection(editor, [ 0, 0 ], 'This '.length, [ 2, 0 ], 'This is'.length);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'three-paragraphs' });
        assertHtmlContent(editor, [
          '<p>This <span data-mce-annotation="test-annotation" data-test-anything="three-paragraphs" data-mce-annotation-uid="test-uid" class="mce-annotation">is the first paragraph</span></p>',
          '<p><span data-mce-annotation="test-annotation" data-test-anything="three-paragraphs" data-mce-annotation-uid="test-uid" class="mce-annotation">This is the second.</span></p>',
          '<p><span data-mce-annotation="test-annotation" data-test-anything="three-paragraphs" data-mce-annotation-uid="test-uid" class="mce-annotation">This is</span> the third.</p>'
        ]);
        TinyAssertions.assertSelection(editor, [ 0 ], 1, [ 2 ], 1);

      });

      const selectCellsWithMouse = (editor: Editor, selectCells: [ string, string ]) => {
        const table = SelectorFind.descendant<HTMLTableElement>(TinyDom.body(editor), 'table').getOrDie('Could not find table');
        const cells = SelectorFilter.descendants<HTMLTableCellElement>(table, 'td,th');
        const startTd = Arr.find(cells, (elm) => Html.get(elm) === selectCells[0]).getOrDie('Could not find start TD');
        const endTd = Arr.find(cells, (elm) => Html.get(elm) === selectCells[1]).getOrDie('Could not find end TD');

        Mouse.mouseDown(startTd, { button: 0 });
        Mouse.mouseOver(endTd, { button: 0 });
        Mouse.mouseUp(endTd, { button: 0 });
      };

      it('testing in table', () => {
        const editor = hook.editor();
        // '<table><tbody><tr><td>|cell 1|</td><td>cell 2</td></tr><tr><td>|cell 3|</td><td>cell 4</td></tr></tbody></table><p>This is the second.</p>'
        modeTestSetContent(editor, '<table><tbody><tr><td data-mce-selected="1">cell 1</td><td>cell 2</td></tr><tr><td data-mce-selected="1">cell 3</td><td>cell 4</td></tr></tbody></table><p>This is the second.</p>');
        selectCellsWithMouse(editor, [ 'cell 1', 'cell 3' ]);
        annotate(editor, 'test-annotation', 'test-uid', { anything: 'table' });
        assertHtmlContent(editor, [
          [
            '<table><tbody>',
            '<tr><td><span data-test-anything="table" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation">cell 1</span></td><td>cell 2</td></tr>',
            '<tr><td><span data-test-anything="table" data-mce-annotation="test-annotation" data-mce-annotation-uid="test-uid" class="mce-annotation">cell 3</span></td><td>cell 4</td></tr>',
            '</tbody></table>'
          ].join(''),
          '<p>This is the second.</p>'
        ], true);
      });

      it('TINY-9467: Annotations should apply for noneditable content', () => {
        TinyState.withNoneditableRootEditor(hook.editor(), (editor) => {
          modeTestSetContent(editor, '<p>text</p>');
          TinySelections.setSelection(editor, [ 0, 0 ], 0, [ 0, 0 ], 4);
          annotate(editor, 'test-annotation', 'test-uid', { anything: 'noneditable' });
          assertHtmlContent(editor, [
            '<p><span class="mce-annotation" data-mce-annotation-uid="test-uid" data-mce-annotation="test-annotation" data-test-anything="noneditable">text</span></p>',
          ]);
        });
      });
    });
  });
});
