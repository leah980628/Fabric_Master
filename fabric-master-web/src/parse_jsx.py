import sys

def check_div_balance(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()
    
    depth = 0
    for i in range(834, 1223):
        line = lines[i]
        opens = line.count('<div')
        closes = line.count('</div')
        
        depth += opens
        depth -= closes
        
        if depth < 2: # At line 837, depth becomes 2. It should never drop below 2 until the end of LEFT column (where it becomes 1).
            print(f"Depth dropped to {depth} at line {i + 1}: {line.strip()}")
        
check_div_balance('/Users/yms/.gemini/Fabric_Master/fabric-master-web/src/CalculatorModal.jsx')
