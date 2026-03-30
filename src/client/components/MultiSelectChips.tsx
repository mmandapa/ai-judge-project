/**
 * Reusable chip-based multi-select control.
 */
type Option = {
  id: string;
  label: string;
};

/**
 * Renders toggleable chips and reports the updated selection to the parent.
 */
export function MultiSelectChips(props: {
  options: Option[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  /**
   * Adds or removes a chip id from the selected set.
   */
  function toggle(id: string) {
    if (props.selected.includes(id)) {
      props.onChange(props.selected.filter((value) => value !== id));
      return;
    }

    props.onChange([...props.selected, id]);
  }

  return (
    <div className="chip-group">
      {props.options.map((option) => (
        <button
          key={option.id}
          type="button"
          className={props.selected.includes(option.id) ? "chip chip-active" : "chip"}
          onClick={() => toggle(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
