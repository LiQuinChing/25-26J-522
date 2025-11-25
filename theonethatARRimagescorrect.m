% Base folder containing all the CSV files
input_folder = "C:\Users\Vihara Ching\Documents\Research\Research\Dataset\MIT_BIH_Arrhythmia_datset\archive";

% Output base folder
output_base = "C:\Users\Vihara Ching\Documents\Research\Research\ECG_Images\MATLAB_arrhythmia\";

% List all CSV files
files = dir(fullfile(input_folder, "*.csv"));

% Prioritized lead list
preferred_leads = {'V2','MLII','V5'};

segment_len = 500;
num_required_segments = 10;

for f = 1:length(files)

    fprintf("Processing file: %s\n", files(f).name);

    file_path = fullfile(files(f).folder, files(f).name);
    tbl = readtable(file_path);

    % Detect lead
    varNames = tbl.Properties.VariableNames;
    signal = [];
    used_lead = '';

    for k = 1:numel(preferred_leads)
        lead = preferred_leads{k};
        if ismember(lead, varNames)
            signal = tbl.(lead);
            used_lead = lead;
            break;
        end
    end

    if isempty(signal)
        fprintf("   No usable lead found ? SKIPPING.\n");
        continue;
    end

    signal = (signal - min(signal)) / (max(signal) - min(signal));
    num_segments = floor(length(signal) / segment_len);

    if num_segments < num_required_segments
        fprintf("   Not enough segments ? SKIPPING.\n");
        continue;
    end

    file_name_only = erase(files(f).name, ".csv");
    output_folder = fullfile(output_base, file_name_only + "_" + used_lead + "_segments");

    % Ensure folder exists
    if ~exist(output_folder, 'dir')
        mkdir(output_folder);
    end

    % DEBUG: show folder
    fprintf("   Saving images to: %s\n", output_folder);

    for i = 1:num_required_segments

        % Make filename
        filename = fullfile(output_folder, sprintf('%d.png', i-1));

        % DEBUG: print filename
        fprintf("      Writing: %s\n", filename);

        % If filename is empty or invalid, stop execution
        if isempty(filename) || filename == ""
            error("!!! ERROR: Generated filename is EMPTY !!!");
        end

        % Extract segment
        segment = signal((i-1)*segment_len + 1 : i*segment_len);

        % Generate scalogram
        fb = cwtfilterbank('SignalLength', segment_len, 'Wavelet', 'amor', 'VoicesPerOctave', 12);
        cfs = abs(fb.wt(segment));
        cfs = rescale(cfs);
        rgbImage = ind2rgb(im2uint8(cfs), jet(128));
        rgbImage = imresize(rgbImage, [227 227]);

        % Save
        imwrite(rgbImage, char(filename));

    end

    fprintf("   ? Done: %s (%s)\n", files(f).name, used_lead);
end

disp("All files processed successfully!");
