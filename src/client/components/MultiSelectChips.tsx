/**
 * Reusable chip-based multi-select control.
 */
import { useInspectable } from "../inspect/useInspectable";

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
  inspectId?: string | ((option: Option) => string | null | undefined);
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
        <ChipButton
          key={option.id}
          option={option}
          selected={props.selected.includes(option.id)}
          onClick={() => toggle(option.id)}
          inspectId={typeof props.inspectId === "function" ? props.inspectId(option) : props.inspectId}
        />
      ))}
    </div>
  );
}

function ChipButton(props: {
  option: Option;
  selected: boolean;
  onClick: () => void;
  inspectId?: string | null;
}) {
  const inspectable = useInspectable(props.inspectId);

  return (
    <button
      type="button"
      className={props.selected ? "chip chip-active" : "chip"}
      onClick={props.onClick}
      {...inspectable}
    >
      {props.option.label}
    </button>
  );
}
