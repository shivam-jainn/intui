import json
import sys


def run_case(solution, case):
    n = case["n"]
    roads = case["roads"]
    expected = case["expected"]

    actual = solution.canReachAll(n, roads)
    is_correct = actual == expected

    return {
        "input": {"n": n, "roads": roads},
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
                    "input": {"n": case.get("n"), "roads": case.get("roads")},
                    "expected": case.get("expected"),
                    "actual": None,
                    "output": False,
                    "error": str(error),
                }
            )

    print(json.dumps(results))


if __name__ == "__main__":
    main()
