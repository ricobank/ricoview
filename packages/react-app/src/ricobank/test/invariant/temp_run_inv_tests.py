# Sometimes forge endlessly runs beyond target depth, seen with logging to file
# For now work around with timeout and repeats, so large runs looking for fail seeds always terminate
# Forge can report overall PASS even when invariants fail, so -vv and search output for errors

import subprocess

timeout    = 60
start_seed = 1000
end_seed   = 2000
command = ["forge", "test", "--match-test", "invariant", "-vv", "--fuzz-seed"]

subprocess.run(["forge", "build"])
for seed in range(start_seed, end_seed):
    output = ''
    expired = failed = False
    print(f"seed {seed}: ", end="")
    try:
        output = subprocess.run(command + [str(seed)], timeout=timeout, capture_output=True)
    except subprocess.TimeoutExpired:
        expired = True
    else:
        failed = any(err_str in output.stdout for err_str in (b"FAIL", b"Error: "))

    if failed:
        print("failed")
        break

    if expired: print("expired")
    elif not failed: print("passed")
