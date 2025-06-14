import { FC, useEffect, useState } from "react";
import { Popover, Button, Checkbox } from "@mui/material";

type FilterMap = Record<string, string[]>;

interface FilterPopoverProps {
  appliedFilters: FilterMap;
  onApplyFilters: (filters: FilterMap) => void;
  count: Record<string, Record<string, number> | null>
}

const filters = [
  {
    name: "Object Type",
    value: "objectType",
    options: ["ROCKET BODY", "DEBRIS", "UNKNOWN", "PAYLOAD"],
  },
  {
    name: "Orbit Code",
    value: "orbitCode",
    options: [
      "LEO1", "LEO2", "LEO3", "LEO4", "MEO", "GEO", "HEO", "IGO", "EGO",
      "NSO", "GTO", "GHO", "HAO", "MGO", "LMO", "UFO", "ESO", "UNKNOWN",
    ],
  },
];

const FilterPopover: FC<FilterPopoverProps> = ({ appliedFilters, onApplyFilters, count }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [localFilters, setLocalFilters] = useState<FilterMap>({});

  const open = Boolean(anchorEl);
  const id = open ? "filter-popover" : undefined;

  useEffect(() => {
    if (open) {
      setLocalFilters({ ...appliedFilters });
    }
  }, []);

  const toggleOption = (filterName: string, option: string) => {
    setLocalFilters((prev) => {
      const current = prev[filterName] || [];
      const exists = current.includes(option);
      const updated = exists
        ? current.filter((v) => v !== option)
        : [...current, option];

      return {
        ...prev,
        [filterName]: updated,
      };
    });
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    setAnchorEl(null);
  };

  const handleClear = () => {
    setLocalFilters({ ...appliedFilters });
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  return (
    <div className="filter-popover-container">
      <Button
        aria-describedby={id}
        variant="contained"
        onClick={handleClick}
        className="trigger-button"
      >
        Filter
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "custom-popover" }}
      >
        <div className="popover-container">
          <div className="filter-body">
            {filters.map((filter, index) => (
              <section key={index} className="filter-group-section">
                <h3 className="filter-name">{filter.name}</h3>
                <ul className="filter-options-list">
                  {filter.options.map((option, idx) => (
                    <li key={idx} className="filter-option">
                      <Checkbox
                        sx={{
                          color: "white",
                          "&.Mui-checked": {
                            color: "white",
                          },
                          "& .MuiSvgIcon-root": {
                            backgroundColor: "black",
                            borderRadius: "4px",
                          },
                        }}
                        checked={
                          localFilters[filter.value]?.includes(option) || false
                        }
                        onChange={() => toggleOption(filter.value, option)}
                      />
                      <span>
                        {option}{" "}
                        {!!count?.[filter.value]?.[option] && (
                            <span className="count">({count?.[filter.value]?.[option]})</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <section className="filter-footer-container">
            <Button variant="contained" onClick={handleApply}>
              Apply
            </Button>
            <Button variant="outlined" onClick={handleClear}>
              Clear
            </Button>
          </section>
        </div>
      </Popover>
    </div>
  );
};

export default FilterPopover;
