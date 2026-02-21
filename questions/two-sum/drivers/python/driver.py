import json
import sys


def normalize_pair(indices):
    if not isinstance(indices, list) or len(indices) != 2:
        return None
    try:
        return sorted([int(indices[0]), int(indices[1])])
    except Exception:
        return None


def run_case(solution, case):
    nums = case["nums"]
    target = case["target"]
    expected = case["expected"]

    actual = solution.twoSum(nums, target)

    normalized_actual = normalize_pair(actual)
    normalized_expected = normalize_pair(expected)
    is_correct = normalized_actual == normalized_expected

    return {
        "input": {"nums": nums, "target": target},
        "expected": expected,
        "actual": actual,
        "output": is_correct,
    }


def main():
    if len(sys.argv) < 2:
        print(json.dumps([{"output": False, "error": "Missing testcase file path"}]))
        return

    testcase_path = sys.argv[1]
    cases = []

    with open(testcase_path, "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()
            if not line:
                continue
            cases.append(json.loads(line))

    results = []
    solution = Solution()

    for case in cases:
        try:
            results.append(run_case(solution, case))
        except Exception as error:
            results.append(
                {
                    "input": {"nums": case.get("nums"), "target": case.get("target")},
                    "expected": case.get("expected"),
                    "actual": None,
                    "output": False,
                    "error": str(error),
                }
            )

    print(json.dumps(results))


if __name__ == "__main__":
    main()
